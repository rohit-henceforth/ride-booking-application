import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetUsersDto } from './dto/get-users.dto';
import ApiResponse from 'src/common/helpers/api-response';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateNewEntryDto } from './dto/create-new-entery.dto';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import * as bcrypt from 'bcrypt';
import { User, UserModelPaginate } from 'src/common/schema/user.schema';
import { Types } from 'mongoose';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private userModel: UserModelPaginate,
    private configService: ConfigService,
  ) {}

  async seedSuperAdminData() {
    try {

      const isAlreadyExisting = await this.userModel.findOne({
        contactNumber: this.configService.get('SUPER_ADMIN_CONTACT'),
      });

      if (!isAlreadyExisting) {
        const hashedPassword = await bcrypt.hash(
          this.configService.get('SUPER_ADMIN_PASSWORD'),
          10,
        );

        const superAdmin = new this.userModel({
          name: 'admin',
          contactNumber: this.configService.get('SUPER_ADMIN_CONTACT'),
          password: hashedPassword,
          role: 'super-admin',
          isContactNumberVerified: true,
        });

        await superAdmin.save();
      }

    } catch (error) {

      console.log(`Error occured while seeding the admin data : ${error}`);
      
    }
  }

  async getUsersDetails(getUsersDto: GetUsersDto) {
    const { limit = 10, page = 1 } = getUsersDto;

    const users = await this.userModel.paginate(
      {},
      {
        page: Number(page),
        limit: Number(limit),
        select:
          '_id name contactNumber profilePic profilePicPublicId isContactNumberVerified',
        sort: {
          name: -1,
        },
      },
    );

    return new ApiResponse(
      true,
      'Users data fetched successfully!',
      HttpStatus.OK,
      users?.docs,
    );
  }

  async createNewEntry(
    createNewEntryDto: CreateNewEntryDto,
    role: 'admin' | 'user' = 'user',
  ) {
    const existingUser = await this.userModel.findOne({
      contactNumber: createNewEntryDto.contactNumber,
    });

    if (existingUser) {
        throw new HttpException(
          'An user already exist with same contact number!',
          HttpStatus.BAD_REQUEST,
        );
    }

    const newEntry = new this.userModel({
      ...createNewEntryDto,
      role,
      isContactNumberVerified: true,
    });

    await newEntry.save();

    role = role.charAt(0).toUpperCase() + role.slice(1);

    return new ApiResponse(
      true,
      `${role} created successfully!`,
      HttpStatus.CREATED,
    );
  }

  async deleteEntry(
    deleteEntryDto: DeleteEntryDto,
    role: 'admin' | 'user' = 'user',
  ) {
    const existingUser = await this.userModel.findOne({
      _id: new Types.ObjectId(deleteEntryDto?._id),
      role,
    });

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    if (!existingUser) {
      throw new HttpException(
        `${roleInSentenceCase} doesn't exist!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userModel.findByIdAndDelete(new Types.ObjectId(deleteEntryDto?._id));

    return new ApiResponse(
      true,
      `${roleInSentenceCase} created successfully!`,
      HttpStatus.CREATED,
    );
  }

  async updateEntry(
    updateEntryDto: UpdateEntryDto,
    role: 'admin' | 'user' = 'user',
  ) {
    const existingUser = await this.userModel.findOne({
      _id: new Types.ObjectId(updateEntryDto?._id),
      role,
    });

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    if (!existingUser) {
      throw new HttpException(
        `${roleInSentenceCase} doesn't exist!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedEntry = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(updateEntryDto?._id),
      {
        $set: {
          ...updateEntryDto,
        },
      },
      {
        new: true,
      },
    ).select("_id name contactNumber profilePic profilePicPublicId isContactNumberVerified");

    return new ApiResponse(
      true,
      `${roleInSentenceCase} created successfully!`,
      HttpStatus.CREATED,
      updatedEntry,
    );
  }

}
