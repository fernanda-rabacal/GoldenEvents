import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { Request } from 'express';
import { MessageResponse } from '../../response/message.response';
import { CategoryService } from './category.service';
import { BuyEventTicketDto } from './dto/buy-ticket.dto';
export declare class EventController {
    private readonly eventService;
    private readonly categoryService;
    constructor(eventService: EventService, categoryService: CategoryService);
    findAll(query: QueryEventDto): Promise<import("../../response/pagination.response").Page<{
        category: {
            id: number;
            name: string;
            photo: string;
        };
    } & {
        id: number;
        name: string;
        slug: string;
        photo: string;
        description: string;
        start_date: Date;
        end_date: Date;
        user_id: number;
        category_id: number;
        capacity: number;
        quantity_left: number;
        active: boolean;
        price: number;
        location: string;
        created_at: Date;
        updated_at: Date;
    }>>;
    findAllCategories(): Promise<{
        id: number;
        name: string;
        photo: string;
    }[]>;
    findCategoryById(id: string): Promise<{
        id: number;
        name: string;
        photo: string;
    }>;
    findById(id: number): Promise<{
        id: number;
        name: string;
        slug: string;
        photo: string;
        description: string;
        start_date: Date;
        end_date: Date;
        user_id: number;
        category_id: number;
        capacity: number;
        quantity_left: number;
        active: boolean;
        price: number;
        location: string;
        created_at: Date;
        updated_at: Date;
    }>;
    findBySlug(slug: string): Promise<{
        id: number;
        name: string;
        slug: string;
        photo: string;
        description: string;
        start_date: Date;
        end_date: Date;
        user_id: number;
        category_id: number;
        capacity: number;
        quantity_left: number;
        active: boolean;
        price: number;
        location: string;
        created_at: Date;
        updated_at: Date;
    }>;
    create(req: Request, createEventDto: CreateEventDto): Promise<MessageResponse>;
    buyTicket(id: number, req: Request, buyTicketDto: BuyEventTicketDto): Promise<MessageResponse>;
    update(id: string, updateEventDto: UpdateEventDto, req: Request): Promise<MessageResponse>;
    delete(id: number, req: Request): Promise<{
        id: number;
        name: string;
        slug: string;
        photo: string;
        description: string;
        start_date: Date;
        end_date: Date;
        user_id: number;
        category_id: number;
        capacity: number;
        quantity_left: number;
        active: boolean;
        price: number;
        location: string;
        created_at: Date;
        updated_at: Date;
    }>;
}
